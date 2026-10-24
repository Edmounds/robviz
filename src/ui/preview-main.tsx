import { createRoot } from "react-dom/client";
import { Preview } from "./preview";
import "../app/app.css";
import "./ui.css";

createRoot(document.getElementById("root")!).render(<Preview />);
