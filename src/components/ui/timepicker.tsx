import React, { useState } from "react";

interface TimePickerProps {
  date: string;
  setDate: (newTime: string) => void;
  required?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({ date, setDate, required }) => {
  const [time, setTime] = useState(date || "");

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime: string = e.target.value;
    setTime(newTime);
    setDate(newTime);
  };

  return (
    <div className="flex flex-col">
      <div className="relative flex items-center w-full">
        <input
          type="time"
          value={time}
          onChange={handleTimeChange}
          required={required}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default TimePicker;
