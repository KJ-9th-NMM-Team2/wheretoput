import FileUpload from "@/components/s3_test/FileUpload";

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">S3 파일 업로드</h1>
      <FileUpload />
    </main>
  );
}
