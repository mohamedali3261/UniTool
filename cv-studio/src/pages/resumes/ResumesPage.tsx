import { CreateImportBar } from './CreateImportBar';
import { ExportCenterPanel } from './ExportCenterPanel';
import './resumes.css';
import { SavedResumesGrid } from './SavedResumesGrid';

export function ResumesPage() {
  return (
    <div className="cvr-page" data-testid="cv-resumes-page">
      <CreateImportBar />
      <SavedResumesGrid />
      <ExportCenterPanel />
    </div>
  );
}
