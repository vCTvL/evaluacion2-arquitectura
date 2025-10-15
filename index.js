import express from 'express';
import { fileURLToPath } from 'url';
import path from "path"

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "index.html")
});


app.listen(PORT, () => {
  console.log(`Server corriendo en http://localhost:${PORT}`);
})