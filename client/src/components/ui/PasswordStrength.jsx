const strengthScore = (pwd) => {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 5);
};

const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-indigo-500'];

const PasswordStrength = ({ value }) => {
  const score = strengthScore(value);
  const segments = 5;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`h-1 w-full rounded ${i < score ? colors[Math.max(score - 1, 0)] : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-400">{labels[Math.max(score - 1, 0)]}</div>
    </div>
  );
};

export default PasswordStrength;
