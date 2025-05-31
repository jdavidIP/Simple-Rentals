import React from "react";

function Footer() {
  return (
    <footer className="bg-light text-center p-3 mt-auto">
      <small>&copy; {new Date().getFullYear()} Simple Rentals. All rights reserved.</small>
    </footer>
  );
}

export default Footer;