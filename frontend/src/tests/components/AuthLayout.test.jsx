import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import AuthLayout from "../../components/AuthLayout"; 
import { MemoryRouter, Routes, Route } from "react-router-dom";

function TestChild() {
  return <div data-testid="child">Test Child</div>;
}

describe("AuthLayout", () => {
  it("renders children from Outlet", () => {
    // Use MemoryRouter + Routes to simulate Outlet rendering
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("has the correct class and styles", () => {
    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    const main = container.querySelector("main");
    expect(main).toHaveClass("main-centered-content");
    expect(main).toHaveStyle({ minHeight: "100vh", background: "#fcfdff" });
  });
});