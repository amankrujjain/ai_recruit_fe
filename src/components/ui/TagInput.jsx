import { useState } from 'react';
import { Input } from './Input';
import { Badge } from './Badge';

export function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim();

    if (!tag) return;
    if (value.includes(tag)) {
      setInput('');
      return;
    }

    onChange([...value, tag]);
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="rounded-lg border border-border p-2">
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            className="cursor-pointer"
            onClick={() => removeTag(tag)}
          >
            {tag} ✕
          </Badge>
        ))}
      </div>

      <Input
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
      />
    </div>
  );
}