import express, { NextFunction, Request, Response } from "express"
import dotenv from "dotenv"

const app = express()
dotenv.config()
import { Pool } from 'pg'
import https from 'https'
import fetch from 'node-fetch'
import bodyParser, { json, BodyParser, urlencoded } from "body-parser"

interface Answers {
    answerText: string,
    answerCorrect: boolean
}

interface QuizData {
    question: string,
    answers: Answers[]
}

app.use(bodyParser.json())

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432")
})

const connectToDb = async () => {
    try {
        await pool.connect()
    } catch (e) {
        console.log(e)
    }
}
connectToDb()

const executeCreateQuizTable = async (query: string) => {
    try {
        await pool.query(query)
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

const executeCreateTeamTable = async (query: string) => {
    try {
        await pool.query(query)
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

const createQuizTableQuery = `
CREATE TABLE IF NOT EXISTS "quiz" (
    "id" SERIAL,
    "quiz" jsonb NOT NULL
);`

const createTeamTableQuery = `
    CREATE TABLE IF NOT EXISTS "teams" (
        "id" SERIAL,
        "name" VARCHAR(128) NOT NULL,
        "score" INT,
        PRIMARY KEY("name")
    );
`



executeCreateQuizTable(createQuizTableQuery).then(result => {
    if (result) {
        //pool.query(`DROP TABLE "quiz"`)
        console.log("Table created")
    }
})

executeCreateTeamTable(createTeamTableQuery).then(result => {
    if(result) {
            //pool.query(`DROP TABLE "teams"`)
        console.log('Team table created')
    }
})

const getQuiz = async () => {
    try {
        return await pool.query(`SELECT * FROM "quiz"`)
    } catch (e) {
        console.log(e)
    }

}



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
        console.log(quiz)
        return quiz
    }
    catch(e){
        console.log(e)
    }
}

const createNewQuiz = () => {
    setInterval(() => updateQuiz(), 5000)
}

const getTeams =async() => {
    try {
        return await pool.query(`SELECT * FROM "teams"`)
    } catch (e) {
        console.error(e)
    }
}

const updateTeam = async (score: number, teamName: string) =>{
    try {
        
        await pool.query(`
        UPDATE teams SET score = score + $1 WHERE name = $2
        `,
         [score,teamName])
    } catch (e) {
        console.error(e)
    }
}

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    updateQuiz().then(result => console.log("success"))
    fetchOpenTdb().then(result => console.log(result))
})
app.get("/getQuiz", (req: Request, res: Response, next: NextFunction) => {
    getQuiz().then(result => res.send(result?.rows))
    getQuiz().then(result => console.log(result?.rows))
})

app.put("/updateTeam", (req: Request, res: Response, next: NextFunction) =>{
    updateTeam(req.body.score,req.body.name)
    console.log(req.body.name)
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