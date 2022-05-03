import {Pool} from 'pg'
import {Response, Request, response} from 'express'

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432")
})

const createQuizTableQuery = `
CREATE TABLE IF NOT EXISTS "quiz" (
    "id" SERIAL,
     "question" VARCHAR(512) NOT NULL,
     "answers" VARCHAR(1000) NOT NULL
);`

const createTeamTableQuery = `
    CREATE TABLE IF NOT EXISTS "teams" (
        "id" SERIAL,
        "name" VARCHAR(128) NOT NULL,
        "score" INT
    );
`

const createQuizTable = async () => {
    try {
        pool.query(createQuizTableQuery)
    }catch(e){
        console.error(e)
    }
}

const createTeamTable = async () => {
    try {
        pool.query(createTeamTableQuery)
    } catch (e) {
        console.error(e)
    }
}

const getQuiz = (request:Request, response:Request) =>{
    pool.query(`SELECT * FROM quiz`), (error,results) => {
        response.statusCode(200).json(results.rows)
       }

    }


const updateQuiz = async(question, answers) =>{
    try {
        await pool.query(`DELETE * FROM quiz`)
        await pool.query(
            `INSERT INTO quiz (question, answers)
             VALUES ($1, $2)`, [question,answers]
        )
    } catch (e) {
        console.error(e)
    }
}

const getTeams = async () =>{
    try {
        await pool.query(`SELECT * FROM teams`)
    } catch (e) {
        console.error(e)
    }
}

const updateTeam = async () =>{
    try {
        
        await pool.query(`
        IF EXISTS (SELECT * FROM teams WHERE name = $2)
        BEGIN
        UPDATE teams
        SET score = score + $1 
        WHERE team = $2
        END
        ELSE
        BEGIN
        INSERT INTO teams (name, score) VALUES ($2,$1)
        END`,
         [score,teamName])
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    getQuiz,
    updateQuiz
}


