import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileVideo,
  X,
  CheckCircle2,
} from "lucide-react";

export default function UploadZone() {
  const [file, setFile] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      "video/*": [],
    },

    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  return (
    <div className="space-y-6">

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-slate-700 hover:border-blue-500 transition rounded-3xl bg-slate-950 p-14 cursor-pointer"
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center">

          <div className="bg-blue-600 p-5 rounded-full mb-5">

            <UploadCloud size={42} />

          </div>

          <h2 className="text-2xl font-bold text-white">
            Drag & Drop your video
          </h2>

          <p className="text-slate-400 mt-3 text-center max-w-lg">
            Drop MP4, AVI, MOV or MKV files here or click to browse
            your computer.
          </p>

          <button className="mt-8 bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-medium">

            Browse Files

          </button>

        </div>

      </div>

      {/* Selected File */}

      {file && (

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-4">

              <div className="bg-blue-600 p-3 rounded-xl">

                <FileVideo size={24} />

              </div>

              <div>

                <h3 className="text-white font-semibold">
                  {file.name}
                </h3>

                <p className="text-slate-400 text-sm">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>

              </div>

            </div>

            <button
              onClick={() => setFile(null)}
              className="text-red-400 hover:text-red-500"
            >

              <X />

            </button>

          </div>

          {/* Fake Progress */}

          <div className="mt-6">

            <div className="flex justify-between text-sm mb-2">

              <span className="text-slate-400">
                Upload Progress
              </span>

              <span className="text-green-400">
                100%
              </span>

            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full">

              <div className="w-full h-3 bg-green-500 rounded-full"></div>

            </div>

            <div className="flex items-center gap-2 mt-4 text-green-400">

              <CheckCircle2 size={18} />

              Ready for AI Processing

            </div>

          </div>

        </div>

      )}

    </div>
  );
}