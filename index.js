const Koa = require("koa");
const fs = require("fs");
const path = require("path");
const app = new Koa();

function rewriteImport(content) {
  console.log(content);
  return content.replace(/ from ['|"]([^'"]+)['|"]/g, (s0, s1) => {
    if (s1[0] !== "." && s1[1] !== "/") {
      return ` from '/@modules/${s1}'`;
    } else {
      return s0;
    }
  });
}

app.use(ctx => {
  const { url } = ctx.request;

  // 1. 如果访问 /，直接返回 index.html 文件
  if (url === "/") {
    let content = fs.readFileSync("./index.html", "utf-8");
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
    console.log("prefix", prefix);

    // 3.2.2 找到包
    let module = require(prefix + "/package.json").module;
    // 3.3.3 确定包导出文件的位置
    let p = path.resolve(prefix, module);
    let content = fs.readFileSync(p, "utf8");
    ctx.type = "application/javascript";
    ctx.body = rewriteImport(content);
  }
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
