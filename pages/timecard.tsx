import { NextPage } from "next"
import { useState } from "react"
import Link from "next/link"
import Find from "@/components/timecard/find"
import Edit from "@/components/timecard/edit"
import Create from "@/components/timecard/create"
import Delete from "@/components/timecard/delete"

const Timecard : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [editTimecard, setEditTimecard] = useState(null)
  const [deleteTimecard, setDeleteTimecard] = useState(null)
  const [createDate, setCreateDate] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const handleFind = () => {
    setScreen("find")
  }

  const handleCreate = () => {
    setScreen("create")
  }

  const handleDelete = () => {
    setScreen("delete")
  }

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <h1>Time Card</h1>
      <Link href="/setting/timecard">Setting</Link>
      {screen === "find" ? (
        <>
          <Find setScreen={setScreen} setEditTimecard={setEditTimecard} setDeleteTimecard={setDeleteTimecard} setCreateDate={setCreateDate} refetchFlag={refetchFlag}/>              r
        </>
      ) : screen === "edit" && editTimecard !== null ? (
        <>
          <Edit editTimecard={editTimecard} setScreen={setScreen} refetch={refetch}/>
          <button onClick={handleFind}>Find</button>
        </>
      ) : screen === "delete" && deleteTimecard !== null ? (
        <>
          <Delete deleteTimecard={deleteTimecard} setScreen={setScreen} refetch={refetch}/>
          <button onClick={handleFind}>Find</button>
        </>
      ) : screen === "create" ? (
        <>
          <Create createDate={createDate}/>
          <button onClick={handleFind}>Find</button>
        </>
      ) : null}
    </>
  )
}

export default Timecard
