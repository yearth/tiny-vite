const Koa = require("koa");
const fs = require("fs");
const path = require("path");
const app = new Koa();

app.use(ctx => {
  const { url } = ctx.request;

  // 1. 如果访问 /，直接返回 index.html 文件
  if (url === "/") {
    let content = fs.readFileSync("./index.html", "utf-8");
    ctx.type = "text/html";
    ctx.body = content;
  }

  // 2. 我们想按需加载，需要支持 import, 首先支持最基础的 .js 文件
  if (url.endsWith(".js")) {
    let p = path.resolve(__dirname, url.slice(1));
    let content = fs.readFileSync(p, "utf-8");
    ctx.type = "application/javascript";
    ctx.body = content;
  }
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
