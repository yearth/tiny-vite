// import { name } from "./module.js";

// console.log("Hello ", name);
import { createApp, h } from "vue";

const App = {
  render() {
    // <div><h1>Hello Vue</h1></div>
    return h("div", null, [h("h1", null, String("Hello Vue"))]);
  }
};

createApp(App).mount("#app");
