import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RouteChangeLogger() {
  const loc = useLocation();
  useEffect(() => {
    console.log("[ROUTE] now at:", loc.pathname, loc);
  }, [loc]);
  return null;
}