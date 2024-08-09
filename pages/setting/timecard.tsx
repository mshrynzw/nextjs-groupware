import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/setting/timecard/Find"
import Create from "@/components/setting/timecard/Create"
import Edit from "@/components/setting/timecard/Edit"
import Delete from "@/components/setting/timecard/Delete"
import Head from "next/head"

const Timecard : NextPage = () => {
  const [screen, setScreen] = useState<string>("find")
  const [editTimecardSetting, setEditTimecardSetting] = useState(null)
  const [deleteTimecardSetting, setDeleteTimecardSetting] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <Head>
        <title>Time Card Setting</title>
      </Head>
      <h1>Time Card Setting</h1>
      {screen === "find" ? (
        <Find setScreen={setScreen} setEditTimecardSetting={setEditTimecardSetting} setDeleteTimecardSetting={setDeleteTimecardSetting} refetchFlag={refetchFlag}/>
      ) : screen === "edit" && editTimecardSetting !== null ? (
        <Edit editTimecardSetting={editTimecardSetting} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "delete" && deleteTimecardSetting !== null ? (
        <Delete deleteTimecardSetting={deleteTimecardSetting} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "create" ? (
        <Create setScreen={setScreen}/>
      ) : null}
      <button onClick={() => setScreen("find")}>Read</button>
      <button onClick={() => setScreen("create")}>Create</button>
    </>
  )
}

export default Timecard
