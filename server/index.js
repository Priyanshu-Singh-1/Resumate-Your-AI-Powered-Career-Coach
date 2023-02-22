// Importing the necessary libraries

// Framework for providing several features for building web application
const express = require("express"); 

// This will be used for commuication between the different domains
const cors = require("cors");

const app = express();

// Declaring the PORT
const PORT = 4000;

const { Configuration, OpenAIApi } = require("openai");


// Multer is nodejs middleware used for uploading files to the server
const multer = require("multer");
const path = require("path");


app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cors());

const generateID = () => Math.random().toString(36).substring(2, 10);

app.get("/api", (req, res) => {
    res.json({
        message: "Hello world",
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
});

// Configuring the API Key

//Here you have to take care of the credentials, for every user they will have their own
//organization ID - https://beta.openai.com/account/org-settings
//And can make an API key using - https://beta.openai.com/account/api-keys
//Create once api key and paste below

const configuration = new Configuration({
    apiKey: "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",
});

const openai = new OpenAIApi(configuration);

const database = [];

// This is the fucntion that will take the text prompt and will generate the AI generated result
// In this , I am using the text-davinci-003 model to generate an appropriate answer to the prompt.

const ChatGPTFunction = async (text) => {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: text,
        temperature: 0.6,
        max_tokens: 250,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    });
    return response.data.choices[0].text;
};

// This is being used to accept the form data from the client, convert the workHistory 
// and put them in an object.

app.post("/resume/create", upload.single("headshotImage"), async (req, res) => {
    const {
        fullName,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory, //JSON format
    } = req.body;

    const workArray = JSON.parse(workHistory); //an array

    //👇🏻 group the values into an object
    const newEntry = {
        id: generateID(),
        fullName,
        image_url: `http://localhost:4000/uploads/${req.file.filename}`,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory: workArray,
    };

    const prompt1 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write a 100 words description for the top of the resume(first person writing)?`;

	const prompt2 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write 10 points for a resume on what I am good at?`;

	const remainderText = () => {
		let stringText = "";
		for (let i = 0; i < workArray.length; i++) {
			stringText += ` ${workArray[i].name} as a ${workArray[i].position}.`;
		}
		return stringText;
	};

    const prompt3 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n During my years I worked at ${
		workArray.length
	} companies. ${remainderText()} \n Can you write me 50 words for each company seperated in numbers of my succession in the company (in first person)?`;

	const objective = await ChatGPTFunction(prompt1);
	const keypoints = await ChatGPTFunction(prompt2);
	const jobResponsibilities = await ChatGPTFunction(prompt3);

	const chatgptData = { objective, keypoints, jobResponsibilities };
	const data = { ...newEntry, ...chatgptData };
	database.push(data);

    res.json({
		message: "Request successful!",
		data,
	});
});


app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
