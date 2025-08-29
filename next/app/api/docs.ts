import swaggerSpec from "../../lib/swagger";

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
}
