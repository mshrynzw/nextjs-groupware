import Sidebar from "././sidebar"
import React from "react"

const Layout = ({ children } : { children : React.ReactNode }) => {
  return (
    <>
      <Sidebar/>
      <div className="relative md:ml-64 bg-blueGray-100">
        <main className="px-4 md:px-10 mx-auto w-full -m-24">
          {children}
        </main>
      </div>
    </>
  )
}

export default Layout
