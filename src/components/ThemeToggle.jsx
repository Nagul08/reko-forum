import styles from './ThemeToggle.module.css'

const defaultOptions = {
  invertedIconLogic: false,
}

export default function ThemeToggle({
  isDark,
  onChange,
  invertedIconLogic = defaultOptions.invertedIconLogic,
}) {
  return (
    <label
      className={styles.container}
      title={isDark ? 'Activate light mode' : 'Activate dark mode'}
      aria-label={isDark ? 'Activate light mode' : 'Activate dark mode'}
    >
      <input
        type="checkbox"
        checked={invertedIconLogic ? !isDark : isDark}
        onChange={onChange}
      />
      <div />
    </label>
  )
}