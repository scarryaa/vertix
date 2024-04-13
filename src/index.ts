import express from "express";

class Vertix {
	async run() {
		const app = express();
		const port = 3000;

		app.get("/", (req, res) => {
			res.send("Hello World!");
		});

		app.listen(port, () => {
			console.log(`Server running at http://localhost:${port}/`);
		});
	}
}

const vertix = new Vertix();
vertix.run();
