'use client';

import { useEffect, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function DateTimeField({ value, onChange, required }: Props) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!value) {
      setDate('');
      setTime('');
      return;
    }
    const [nextDate = '', nextTime = ''] = value.split('T');
    setDate(nextDate);
    setTime(nextTime);
  }, [value]);

  function update(nextDate: string, nextTime: string) {
    setDate(nextDate);
    setTime(nextTime);
    if (nextDate && nextTime) {
      onChange(`${nextDate}T${nextTime}`);
    } else {
      onChange('');
    }
  }

  return (
    <div className="datetime-picker">
      <div className="datetime-field">
        <label className="field-label">Data</label>
        <input
          type="date"
          className="datetime-input"
          value={date}
          onChange={(e) => update(e.target.value, time)}
          required={required}
        />
      </div>
      <div className="datetime-field">
        <label className="field-label">Horário</label>
        <input
          type="time"
          className="datetime-input"
          value={time}
          onChange={(e) => update(date, e.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}
