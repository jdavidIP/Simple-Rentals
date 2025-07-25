import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../../components/footer";

describe("Footer", () => {
  it("renders the footer with correct text and year", () => {
    render(<Footer />);
    // Check the footer element is in the document
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    // Check the copyright text
    const year = new Date().getFullYear();
    expect(
      screen.getByText(
        new RegExp(`©\\s*${year}\\s*Simple Rentals\\. All rights reserved\\.`)
      )
    ).toBeInTheDocument();
  });
});