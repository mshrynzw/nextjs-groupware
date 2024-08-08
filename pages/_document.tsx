import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>GW</title>
      </Head>
      <body>
      <div id="page-transition"></div>
      <Main/>
      <NextScript/>
      </body>
    </Html>
  )
}
