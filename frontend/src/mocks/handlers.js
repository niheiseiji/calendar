import { rest } from "msw";
import events from "./event";

export const handlers = [
  rest.get("https://jsonplaceholder.typicode.com/users", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([{ id: 1, name: "John" }]));
  }),
  rest.get("/events", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(events));
  }),
];
