import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/setting/group/Find"
import Delete from "@/components/setting/group/Delete"
import Create from "@/components/setting/group/Create"
import Edit from "@/components/setting/group/Edit"

const Group : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [editGroup, setEditGroup] = useState(null)
  const [deleteGroup, setDeleteGroup] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <h1>Info</h1>
      {screen === "find" ? (
        <Find setScreen={setScreen} setEditGroup={setEditGroup} setDeleteGroup={setDeleteGroup} refetchFlag={refetchFlag}/>
      ) : screen === "edit" && editGroup !== null ? (
        <Edit editGroup={editGroup} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "delete" && deleteGroup !== null ? (
        <Delete deleteGroup={deleteGroup} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "create" ? (
        <Create/>
      ) : null}
      <button onClick={() => setScreen("find")}>Read</button>
      <button onClick={() => setScreen("create")}>Create</button>
    </>
  )
}

export default Group
