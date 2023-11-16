import { createApp } from "vue";
import App from "./App.vue";

import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

if (process.env.NODE_ENV === 'development') {
  const { worker } = await import("./mocks/browser");
  worker.start();
}
const app = createApp(App);

app.component("VueDatePicker", VueDatePicker);

app.mount("#app");
