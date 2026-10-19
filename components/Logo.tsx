export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 212 320" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="196" height="304" rx="98" stroke="currentColor" strokeWidth="4" />
      <path d="M106 279V65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <g fill="currentColor">
        <path d="M106 91C87 86 73 70 70 51c19 4 33 17 36 36zM106 91c19-5 33-21 36-40-19 4-33 17-36 36z" />
        <path d="M106 123c-24-5-42-22-46-45 23 4 41 20 46 41zM106 123c24-5 42-22 46-45-23 4-41 20-46 41z" />
        <path d="M106 158c-28-5-49-25-53-51 26 5 47 22 53 47zM106 158c28-5 49-25 53-51-26 5-47 22-53 47z" />
        <path d="M106 193c-31-5-55-27-60-55 29 5 52 24 60 51zM106 193c31-5 55-27 60-55-29 5-52 24-60 51z" />
        <path d="M106 229c-28-4-50-23-56-49 27 4 49 21 56 45zM106 229c28-4 50-23 56-49-27 4-49 21-56 45z" />
        <path d="M106 259c-21-3-38-17-43-37 21 3 38 16 43 34zM106 259c21-3 38-17 43-37-21 3-38 16-43 34z" />
      </g>
    </svg>
  )
}
