import express, { NextFunction, Request, Response } from "express"
import dotenv from "dotenv"

const app = express()
dotenv.config()
import { Pool } from 'pg'
import https from 'https'
import fetch from 'node-fetch'
import bodyParser, { json, BodyParser, urlencoded } from "body-parser"
import cors from 'cors'

interface Answers {
    answerText: string,
    answerCorrect: boolean
}

interface QuizData {
    question: string,
    answers: Answers[]
}

const corsOptions = {
    origin: (origin:any, callback:any) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
  };

const options: cors.CorsOptions = {
    allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}

app.use(cors(options))
app.use(bodyParser.json())

// const pool = new Pool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: parseInt(process.env.DB_PORT || "5432")
// })

const pool = new Pool({
    connectionString: "postgres://vtydnzuxsjacni:d04c83ca1a943b2818a100071044f43da6abfb728965652b9099131a0dc9a533@ec2-63-32-248-14.eu-west-1.compute.amazonaws.com:5432/d6uq3tjgea5nbv",
    ssl:{
        rejectUnauthorized:false
    }
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
    
    const createNewQuiz = () => {
        setInterval(() => updateQuiz(), 7200000)
    }
    
    createNewQuiz()

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
    updateQuiz().then(result => res.send("success"))
    
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