import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

interface GuitarString {
  name: string;
  frequency: number;
  string: string;
}

interface NoteFrequencies {
  [key: string]: number;
}

const GuitarTuner: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [currentFrequency, setCurrentFrequency] = useState<number>(0);
  const [cents, setCents] = useState<number>(0);
  const [selectedString, setSelectedString] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPresetOpen, setIsPresetOpen] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationRef = useRef<number | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [presetName, setPresetName] =
    useState<keyof typeof presets>("Standard");

  const presets: { [key: string]: GuitarString[] } = {
    Standard: [
      { name: "E", frequency: 82.41, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "B", frequency: 246.94, string: "2nd" },
      { name: "E", frequency: 329.63, string: "1st" },
    ],
    DropD: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "B", frequency: 246.94, string: "2nd" },
      { name: "E", frequency: 329.63, string: "1st" },
    ],
    DoubleDropD: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "B", frequency: 246.94, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    DropC: [
      { name: "C", frequency: 65.41, string: "6th" },
      { name: "G", frequency: 98.0, string: "5th" },
      { name: "C", frequency: 130.81, string: "4th" },
      { name: "F", frequency: 174.61, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    HalfStepDown: [
      { name: "Eb", frequency: 77.78, string: "6th" },
      { name: "Ab", frequency: 103.83, string: "5th" },
      { name: "Db", frequency: 138.59, string: "4th" },
      { name: "Gb", frequency: 185.0, string: "3rd" },
      { name: "Bb", frequency: 233.08, string: "2nd" },
      { name: "Eb", frequency: 311.13, string: "1st" },
    ],
    FullStepDown: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "G", frequency: 98.0, string: "5th" },
      { name: "C", frequency: 130.81, string: "4th" },
      { name: "F", frequency: 174.61, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    DStandard: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "G", frequency: 98.0, string: "5th" },
      { name: "C", frequency: 130.81, string: "4th" },
      { name: "F", frequency: 174.61, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    CStandard: [
      { name: "C", frequency: 65.41, string: "6th" },
      { name: "F", frequency: 87.31, string: "5th" },
      { name: "Bb", frequency: 116.54, string: "4th" },
      { name: "Eb", frequency: 155.56, string: "3rd" },
      { name: "G", frequency: 196.0, string: "2nd" },
      { name: "C", frequency: 261.63, string: "1st" },
    ],
    OpenD: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "F#", frequency: 185.0, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    OpenE: [
      { name: "E", frequency: 82.41, string: "6th" },
      { name: "B", frequency: 123.47, string: "5th" },
      { name: "E", frequency: 164.81, string: "4th" },
      { name: "G#", frequency: 207.65, string: "3rd" },
      { name: "B", frequency: 246.94, string: "2nd" },
      { name: "E", frequency: 329.63, string: "1st" },
    ],
    OpenG: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "G", frequency: 98.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "B", frequency: 246.94, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    OpenA: [
      { name: "E", frequency: 82.41, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "E", frequency: 164.81, string: "4th" },
      { name: "A", frequency: 220.0, string: "3rd" },
      { name: "C#", frequency: 277.18, string: "2nd" },
      { name: "E", frequency: 329.63, string: "1st" },
    ],
    OpenC: [
      { name: "C", frequency: 65.41, string: "6th" },
      { name: "G", frequency: 98.0, string: "5th" },
      { name: "C", frequency: 130.81, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "C", frequency: 261.63, string: "2nd" },
      { name: "E", frequency: 329.63, string: "1st" },
    ],
    OpenDm: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "F", frequency: 174.61, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    DADGAD: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
    C6: [
      { name: "C", frequency: 65.41, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "C", frequency: 130.81, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "C", frequency: 261.63, string: "2nd" },
      { name: "E", frequency: 329.63, string: "1st" },
    ],
    ModalD: [
      { name: "D", frequency: 73.42, string: "6th" },
      { name: "A", frequency: 110.0, string: "5th" },
      { name: "D", frequency: 146.83, string: "4th" },
      { name: "G", frequency: 196.0, string: "3rd" },
      { name: "A", frequency: 220.0, string: "2nd" },
      { name: "D", frequency: 293.66, string: "1st" },
    ],
  };

  // Convert preset names to display names
  const presetDisplayNames: { [key: string]: string } = {
    Standard: "มาตรฐาน (E-A-D-G-B-E)",
    DropD: "ดรอป D (D-A-D-G-B-E)",
    DoubleDropD: "ดับเบิล ดรอป D (D-A-D-G-B-D)",
    DropC: "ดรอป C (C-G-C-F-A-D)",
    HalfStepDown: "ลดครึ่งเสียง (Eb-Ab-Db-Gb-Bb-Eb)",
    FullStepDown: "ลดเต็มเสียง (D-G-C-F-A-D)",
    DStandard: "D มาตรฐาน (D-G-C-F-A-D)",
    CStandard: "C มาตรฐาน (C-F-Bb-Eb-G-C)",
    OpenD: "โอเพ่น D (D-A-D-F#-A-D)",
    OpenE: "โอเพ่น E (E-B-E-G#-B-E)",
    OpenG: "โอเพ่น G (D-G-D-G-B-D)",
    OpenA: "โอเพ่น A (E-A-E-A-C#-E)",
    OpenC: "โอเพ่น C (C-G-C-G-C-E)",
    OpenDm: "โอเพ่น Dm (D-A-D-F-A-D)",
    DADGAD: "DADGAD (D-A-D-G-A-D)",
    C6: "C6 (C-A-C-G-C-E)",
    ModalD: "โมดอล D (D-A-D-G-A-D)",
  };

  // Standard guitar tuning (6th string to 1st string)
  const guitarStrings: GuitarString[] = presets[presetName];

  // Note frequencies for reference
  const noteFrequencies: NoteFrequencies = {
    C: 261.63,
    "C#": 277.18,
    D: 293.66,
    "D#": 311.13,
    E: 329.63,
    F: 349.23,
    "F#": 369.99,
    G: 392.0,
    "G#": 415.3,
    A: 440.0,
    "A#": 466.16,
    B: 493.88,
  };

  // Get note name from frequency
  const getNote = (frequency: number): string => {
    const A4: number = 440;
    const C0: number = A4 * Math.pow(2, -4.75);

    if (frequency > 0) {
      const h: number = Math.round(12 * Math.log2(frequency / C0));
      const octave: number = Math.floor(h / 12);
      const n: number = h % 12;
      const notes: string[] = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      return notes[n];
    }
    return "";
  };

  // Calculate cents deviation
  const getCents = (frequency: number, targetFrequency: number): number => {
    return Math.floor(1200 * Math.log2(frequency / targetFrequency));
  };

  // Get dominant frequency from audio data
  const getFrequency = (dataArray: Uint8Array, sampleRate: number): number => {
    let maxValue: number = 0;
    let maxIndex: number = 0;

    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    return (maxIndex * sampleRate) / (dataArray.length * 2);
  };

  // Start audio analysis
  const startListening = async (): Promise<void> => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 4096;
      const bufferLength: number = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      analyze();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการใช้งานไมโครโฟน");
    }
  };

  // Stop listening
  const stopListening = (): void => {
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsListening(false);
    setCurrentNote("");
    setCurrentFrequency(0);
    setCents(0);
  };

  // Analyze audio
  const analyze = (): void => {
    if (
      !analyserRef.current ||
      !dataArrayRef.current ||
      !audioContextRef.current
    )
      return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const frequency: number = getFrequency(
      dataArrayRef.current,
      audioContextRef.current.sampleRate
    );

    if (frequency > 70 && frequency < 400) {
      const note: string = getNote(frequency);
      const targetString: GuitarString | undefined = guitarStrings.find(
        (s) => s.name === note
      );

      if (targetString) {
        const centDeviation: number = getCents(
          frequency,
          targetString.frequency
        );
        setCurrentNote(note);
        setCurrentFrequency(frequency);
        setCents(centDeviation);
      }
    }

    animationRef.current = requestAnimationFrame(analyze);
  };

  // Play reference tone
  const playReferenceTone = (frequency: number): void => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
    }

    if (!isMuted) {
      const audioContext: AudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      oscillatorRef.current = audioContext.createOscillator();
      gainNodeRef.current = audioContext.createGain();

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContext.destination);

      oscillatorRef.current.frequency.value = frequency;
      oscillatorRef.current.type = "sine";
      gainNodeRef.current.gain.value = volume;

      oscillatorRef.current.start();
      oscillatorRef.current.stop(audioContext.currentTime + 1);
    }
  };

  // Get tuning indicator color
  const getTuningColor = (): string => {
    if (Math.abs(cents) < 5) return "text-green-500";
    if (Math.abs(cents) < 15) return "text-yellow-500";
    return "text-red-500";
  };

  // Get tuning status
  const getTuningStatus = (): string => {
    if (Math.abs(cents) < 5) return "ถูกต้อง";
    if (cents > 0) return "สูงเกินไป";
    return "ต่ำเกินไป";
  };

  // Handle preset change
  const handlePresetChange = (newPreset: string): void => {
    setPresetName(newPreset);
    setSelectedString(0);
    setIsPresetOpen(false);

    // Reset tuning display
    setCurrentNote("");
    setCurrentFrequency(0);
    setCents(0);
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      stopListening();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            🎸 Guitar Tuner
          </h1>

          {/* Preset Selection */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-3">
              เลือกรูปแบบการปรับจูน
            </label>
            <div className="relative">
              <button
                onClick={() => setIsPresetOpen(!isPresetOpen)}
                className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg flex items-center justify-between transition-all border border-white/30"
              >
                <span className="text-sm">
                  {presetDisplayNames[presetName]}
                </span>
                <ChevronDown
                  size={20}
                  className={`transform transition-transform ${
                    isPresetOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isPresetOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/20 backdrop-blur-lg rounded-lg border border-white/30 shadow-xl z-10 max-h-60 overflow-y-auto">
                  {Object.keys(presets).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetChange(preset)}
                      className={`w-full text-left px-4 py-3 hover:bg-white/20 transition-all text-sm ${
                        presetName === preset
                          ? "bg-blue-500/30 text-white"
                          : "text-gray-200"
                      }`}
                    >
                      {presetDisplayNames[preset]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Display */}
          <div className="bg-black/30 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-2">
                {currentNote || "--"}
              </div>
              <div className="text-xl text-gray-300 mb-2">
                {currentFrequency.toFixed(1)} Hz
              </div>
              <div className={`text-lg font-semibold ${getTuningColor()}`}>
                {currentNote ? getTuningStatus() : "เริ่มต้นการปรับจูน"}
              </div>
            </div>

            {/* Tuning Meter */}
            <div className="mt-6">
              <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-6 bg-white"></div>
                </div>
                {currentNote && (
                  <div
                    className={`absolute top-0 h-full w-2 rounded-full transition-all duration-300 ${
                      Math.abs(cents) < 5
                        ? "bg-green-500"
                        : Math.abs(cents) < 15
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      left: `${Math.max(0, Math.min(100, (cents + 50) * 2))}%`,
                      transform: "translateX(-50%)",
                    }}
                  ></div>
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>-50¢</span>
                <span>0¢</span>
                <span>+50¢</span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {isListening ? <Pause size={20} /> : <Play size={20} />}
              {isListening ? "หยุด" : "เริ่ม"}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-all"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          {/* Volume Control */}
          {!isMuted && (
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                ระดับเสียง
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setVolume(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Guitar Strings */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold mb-3">
              สายกีตาร์ ({presetDisplayNames[presetName].split(" ")[0]})
            </h3>
            {guitarStrings.map((string, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedString === index
                    ? "bg-blue-500/30 border border-blue-400"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                onClick={() => setSelectedString(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="text-white">
                    <div className="font-semibold">{string.name}</div>
                    <div className="text-sm text-gray-300">
                      {string.string} String
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">
                    {string.frequency.toFixed(1)} Hz
                  </span>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      playReferenceTone(string.frequency);
                    }}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all"
                  >
                    <Play size={16} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-2">วิธีใช้งาน:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• เลือกรูปแบบการปรับจูนที่ต้องการ</li>
              <li>• กดปุ่ม "เริ่ม" เพื่อเปิดไมโครโฟน</li>
              <li>• เล่นสายกีตาร์ให้ใกล้ไมโครโฟน</li>
              <li>• ปรับสายตามตัวบ่งชี้สี</li>
              <li>• เขียว = ถูกต้อง, เหลือง = ใกล้แล้ว, แดง = ต้องปรับ</li>
              <li>• กดปุ่ม Play เพื่อฟังเสียงอ้างอิง</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuitarTuner;
