import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/info/find"
import Delete from "@/components/info/delete"
import Create from "@/components/info/create"
import Edit from "@/components/info/edit"

const Info : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [editInfo, setEditInfo] = useState(null)
  const [deleteInfo, setDeleteInfo] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <h1>Info</h1>
      {screen === "find" ? (
        <Find setScreen={setScreen} setEditInfo={setEditInfo} setDeleteInfo={setDeleteInfo} refetchFlag={refetchFlag}/>
      ) : screen === "edit" && editInfo !== null ?(
        <Edit editInfo={editInfo} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "delete" && deleteInfo !== null ? (
        <Delete deleteInfo={deleteInfo} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "create" ? (
        <Create/>
      ) : null}
      <button onClick={() => setScreen("find")}>Read</button>
      <button onClick={() => setScreen("create")}>Create</button>
    </>
  )
}

export default Info
