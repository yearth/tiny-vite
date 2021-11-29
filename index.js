const Koa = require("koa");
const fs = require("fs");
const path = require("path");
const compilerSfc = require("@vue/compiler-sfc");
const compilerDom = require("@vue/compiler-dom");
const app = new Koa();

function rewriteImport(content) {
  return content.replace(/ from ['|"]([^'"]+)['|"]/g, (s0, s1) => {
    if (s1[0] !== "." && s1[1] !== "/") {
      return ` from '/@modules/${s1}'`;
    } else {
      return s0;
    }
  });
}

app.use(ctx => {
  const { url, query } = ctx.request;

  // 1. 如果访问 /，直接返回 index.html 文件
  if (url === "/") {
    let content = fs.readFileSync("./index.html", "utf-8");
    content = content.replace(
      "<script",
      `
      <script>
        window.process = {
            env: {
            NODE_ENV: "dev"
            }
        };
        </script>
        <script
      `
    );
    ctx.type = "text/html";
    ctx.body = content;
  }

  // 2. 我们想按需加载，需要支持 import, 首先支持最基础的 .js 文件
  else if (url.endsWith(".js")) {
    let p = path.resolve(__dirname, url.slice(1));
    let content = fs.readFileSync(p, "utf-8");
    ctx.type = "application/javascript";
    ctx.body = rewriteImport(content);
  }

  // 3. 如果用户引入的模块是从 node_modules 来的，怎么办？
  // 3.1 首先，以 vue 为例，import vue from "vue"; 我们需要欺骗浏览器，绕过这个报错 => to rewriteImport
  // 3.2 /@modules/vue 同样是找不到的，所以我们现在需要找到 node_modules/vue/package.json 下的入口 module
  else if (url.startsWith("/@modules")) {
    // 3.2.1 找到包的位置
    let prefix = path.resolve(__dirname, "node_modules", url.replace("/@modules/", ""));

    // 3.2.2 找到包
    let module = require(prefix + "/package.json").module;

    // 3.3.3 确定包导出文件的位置
    let p = path.resolve(prefix, module);
    let content = fs.readFileSync(p, "utf8");
    ctx.type = "application/javascript";
    ctx.body = rewriteImport(content);
  }

  // 4. 支持 SFC
  // 4.1 我们拿到的是 .vue 文件，其中核心是 template 和 script 部分，而 vue 本身提供了一个包用于解析 .vue 文件（compiler-sfc）
  else if (url.includes(".vue")) {
    // ps: 想想这里为什么不用 endWith
    // 4.1.1 那么首先需要解析这个 .vue 文件
    let p = path.resolve(__dirname, url.split("?")[0].slice(1));
    let content = fs.readFileSync(p, "utf-8");
    content = compilerSfc.parse(content);
    if (!query.type) {
      // 4.1.2 组装 js 部分，这里主要是 descriptor 的 script
      let jsc = content.descriptor.script.content;
      ctx.type = "application/javascript";
      ctx.body = `
        ${rewriteImport(jsc.replace("export default ", "const __script = "))}
        import { render as __render } from '${url}?type=template'
        __script.render = __render
        export default __script
      `;
    } else {
      // 4.2.2 组装 render 部分
      let template = content.descriptor.template.content;
      let render = compilerDom.compile(template, { mode: "module" });
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(render.code);
    }
  }

  // 5. 支持 css 文件
  else if (url.endsWith(".css")) {
    // 核心思路，把 css 转化为 js
    // 即利用 js 添加一个 css 标签
    let p = path.resolve(__dirname, url.slice(1));
    let content = fs.readFileSync(p, "utf-8");
    content = `
        const css = "${content.replace(/\n/g, "")}"
        let link = document.createElement('style')
        link.setAttribute('type', 'text/css')
        document.head.appendChild(link)
        link.innerHTML = css
        export default css
      `;

    ctx.type = "application/javascript";
    ctx.body = content;
  }
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
