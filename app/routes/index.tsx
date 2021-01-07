import * as React from "react";
import { Form, usePendingFormSubmit, useRouteData } from "@remix-run/react";
import { Flag } from "@prisma/client";

export function meta() {
  return {
    title: "Remix Starter",
    description: "Welcome to remix!",
  };
}

interface Data {
  flags: Array<Flag>;
}

export default function Index() {
  let data = useRouteData<Data>();
  const pendingForm = usePendingFormSubmit();

  return (
    <div className="max-w-screen-md mx-auto">
      <h1>Your Team's Feature Flags</h1>
      {data.flags.length > 0 ? (
        <ul className="border-t border-l border-r border-gray-300">
          <li className="flex justify-between font-medium text-center border-b border-gray-300">
            <span className="flex-1">Feature</span>
            <span className="flex-1">Type</span>
            <span className="flex-1">Value</span>
            <span className="flex-1">Delete</span>
          </li>
          {data.flags.map((flag) => (
            <li
              key={flag.id}
              className="flex justify-between font-medium text-center border-b border-gray-300"
            >
              <span className="flex-1">{flag.feature}</span>
              <span className="flex-1">{flag.type}</span>
              <span className="flex-1">{flag.value}</span>
              <Form className="flex-1" action="/" method="delete">
                <input type="hidden" name="_method" value="DELETE" />
                <input type="hidden" name="featureId" value={flag.id} />
                <button type="submit">&times;</button>
              </Form>
            </li>
          ))}
        </ul>
      ) : (
        <p>Your team hasn't created any flags yet</p>
      )}

      <Form action="/" method="post">
        <fieldset disabled={!!pendingForm}>
          <input type="text" name="featureName" placeholder="Name of feature" />
          <div>
            <label>
              <span>Boolean (true/false)</span>
              <input type="radio" name="featureType" value="Boolean" />
            </label>
            <label>
              <span>String</span>
              <input type="radio" name="featureType" value="String" />
            </label>
            <label>
              <span>Number</span>
              <input type="radio" name="featureType" value="Int" />
            </label>
          </div>
          <input
            type="text"
            name="featureValue"
            placeholder="Value (if boolean, type true or false"
          />
          <button type="submit">Create</button>
        </fieldset>
      </Form>
    </div>
  );
}
