import Link from "next/link"

const Navbar = () => {
  return (
    <header className="bg-gray-500">
      <ul>
        <li><Link href="/">ホーム</Link></li>
        <li>お知らせ</li>
        <li>チャット</li>
        <li>タイムカード</li>
        <li>設定</li>
        <li><Link href="/signin">Sign In</Link></li>
        <li><Link href="/signup">Sign Up</Link></li>
      </ul>
    </header>
  )
}

export default Navbar
