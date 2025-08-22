
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  orderId: string;
  value?: string | null;
  onSave: (newValue: string | null) => Promise<boolean> | boolean;
}

const OrderTableNumberEditor: React.FC<Props> = ({ orderId, value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<string>(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(val.trim() === '' ? null : val.trim());
    setSaving(false);
    if (success) {
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Table</span>
        <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-sm">
          {value ? value : '—'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="e.g. 12 or T3"
        className="h-8 w-28"
      />
      <Button size="sm" className="h-8" onClick={handleSave} disabled={saving}>
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={() => {
          setVal(value || '');
          setEditing(false);
        }}
        disabled={saving}
      >
        Cancel
      </Button>
    </div>
  );
};

export default OrderTableNumberEditor;
