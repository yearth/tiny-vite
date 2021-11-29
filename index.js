const Koa = require("koa");
const fs = require("fs");
const app = new Koa();

app.use(ctx => {
  const { url } = ctx.request;

  // 1. 如果访问 /，直接返回 index.html 文件
  if (url === "/") {
    let content = fs.readFileSync("./index.html", "utf-8");
    ctx.type = "text/html";
    ctx.body = content;
  }
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
