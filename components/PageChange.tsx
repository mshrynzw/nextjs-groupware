import React, { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faCircleNotch } from "@fortawesome/free-solid-svg-icons"

const PageChange : React.FC = () => {
  return (
    <div className="mx-auto md:ml-64">
      <div className="absolute top-0 left-0 z-50 block h-full w-full bg-blueGray-50"></div>
      <div className="relative top-0 z-50 mx-auto my-32 max-w-sm text-center">
        <div className="mb-4 block">
          <FontAwesomeIcon
            icon={faCircleNotch}
            className="mx-auto animate-spin text-6xl text-blueGray-800"
          />
        </div>
        <h4 className="text-lg font-medium text-blueGray-800">
          Loading...
        </h4>
      </div>
    </div>
  )
}

export default PageChange