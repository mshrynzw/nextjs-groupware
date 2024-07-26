import { NextPage } from "next"
import Link from "next/link"

const Timecard : NextPage =()=>{

  return (
    <>
      <h1>Time Card</h1>
      <Link href="/setting/timecard">Setting</Link>
    </>
  )
}

export default Timecard
