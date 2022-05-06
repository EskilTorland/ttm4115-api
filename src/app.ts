import express, { NextFunction, Request, Response } from "express"
import dotenv from "dotenv"

import { Pool } from 'pg'
import fetch from 'node-fetch'
import bodyParser, { json, BodyParser, urlencoded } from "body-parser"
import cors from 'cors'

//Datatypes for quiz stored in heroku postgres database
interface Answers {
    answerText: string,
    answerCorrect: boolean
}

interface QuizData {
    question: string,
    answers: Answers[]
}

//Options for Cross-Origin Resource Sharing
const options: cors.CorsOptions = {
    allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}

//Config for env variables and Express app
dotenv.config()
const app = express()
app.use(cors(options))
app.use(bodyParser.json())

//Create databasepool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false
    }
    })

    //Connect to database pool
const connectToDb = async () => {
    try {
        await pool.connect()
    } catch (e) {
        console.log(e)
    }
}
connectToDb()

//Function to execute getQuiz query
const getQuiz = async () => {
    try {
        return await pool.query(`SELECT * FROM "quiz"`)
    } catch (e) {
        console.log(e)
    }

}

//Get questions and answers from opentdb and convert them into datatypes to fit our database
const fetchOpenTdb = async() =>{
    try{       
        const response = await fetch("https://opentdb.com/api.php?amount=10&type=multiple",{
            method: 'GET',
        })
        let quiz: QuizData[] = []
        const result:any = await response.json();
        for(let i = 0; i < result.results.length; i++){
            let answerData: Answers[] = []
            answerData.push({answerText: result.results[i].correct_answer, answerCorrect: true})
            for(let j = 0; j < 3; j++) {
                answerData.push({answerText: result.results[i].incorrect_answers[j], answerCorrect: false})
            }
            let quizEntry:QuizData = {question: result.results[i].question, answers: answerData}
            quiz.push(quizEntry)
        }
        return quiz
    }
    catch(e){
        console.log(e)
    }
}

//Removes old quiz from database and inserts a new one fethced from opentdb
const updateQuiz = async () => {
    try {
        let quiz: QuizData[] | undefined = await fetchOpenTdb()
        if(quiz != undefined){
            await pool.query(`DELETE FROM "quiz"`)
            for(let quizEntry of quiz){
                await pool.query(
                    `INSERT INTO quiz (quiz)
                    VALUES ($1)`, [quizEntry]
                    )
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
    
//Create a new quiz every two hours
//*Does not work on heroku deployment as image is put to sleep after some time
//Call /updateQuiz instead to refresh quiz
const createNewQuiz = () => {
setInterval(() => updateQuiz(), 7200000)
}
    
createNewQuiz()


//Routes for REST API
app.get("/updateQuiz", (req: Request, res: Response, next: NextFunction) => {
    updateQuiz().then(result => res.send("success"))
    
})
app.get("/getQuiz", (req: Request, res: Response, next: NextFunction) => {
    getQuiz().then(result => res.send(result?.rows))
    getQuiz().then(result => console.log(result?.rows))
})

app.get("/getTeams",(req: Request, res: Response, next: NextFunction) =>{
    res.send([{
        "name":"Office1",
        "score":145
    }
,{
    "name":"Office2",
        "score":136
}
,{
    "name":"Office3",
    "score":111
}
,{
    "name":"Office4",
    "score":96
}
,{
    "name":"Office5",
    "score":76
}
,
{
    "name":"Office6",
    "score":56
}
,
{
    "name":"Office7",
    "score":37
}
])
})


app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`)
})