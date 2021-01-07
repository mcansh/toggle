import * as React from "react";
import { Form, usePendingFormSubmit, useRouteData } from "@remix-run/react";

export function meta() {
  return {
    title: "Register | Remix Starter",
    description: "Welcome to remix!",
  };
}

const inputStyles: React.CSSProperties = {
  borderRadius: "0.25rem",
  appearance: "none",
  border: "2px solid black",
  marginBottom: "0.25rem",
  fontSize: "1rem",
  padding: "4px 10px",
};

export default function Login() {
  const pendingForm = usePendingFormSubmit();
  const { csrf } = useRouteData<{ csrf: string }>();

  return (
    <div>
      <Form method="post" action="/login">
        <fieldset
          disabled={!!pendingForm}
          style={{
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            border: "none",
          }}
        >
          <input type="hidden" name="_csrf" value={csrf} />
          <input
            type="email"
            autoComplete="email"
            placeholder="email"
            name="email"
            style={inputStyles}
          />
          <button type="submit" style={{ fontSize: "1rem" }}>
            Log in
          </button>
        </fieldset>
      </Form>
    </div>
  );
}
