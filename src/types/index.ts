export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface UploadedFile {
  file: File;
  id: string;
  name: string;
}