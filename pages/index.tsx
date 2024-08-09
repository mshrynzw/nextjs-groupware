import { NextPage } from "next"
import Head from "next/head"
import LineChart from "@/components/dashboard/LineChart"

const Home : NextPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="bg-red-400">
          Chat既読率（毎事・日別）
          <LineChart/>
        </div>
        <div className="bg-yellow-400">
          Todo達成率（自分・全員）
          <LineChart/>
        </div>
        <div className="bg-green-400">
          Schedule（毎事・日別）
          <LineChart/>
        </div>
        <div className="bg-blue-400">
          Timecard達成率（自分・全員）
          <LineChart/>
        </div>
      </div>
    </>
  )
}

export default Home