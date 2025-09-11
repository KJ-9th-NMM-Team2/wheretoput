import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CreateStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

const CreateStartModal: React.FC<CreateStartModalProps> = ({ isOpen, onClose, onStart }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="relative flex min-h-[500px] flex-col gap-8 bg-cover bg-center bg-no-repeat rounded-xl justify-center p-12"
        style={{
          backgroundImage: `linear-gradient(
            rgba(255, 255, 255, 0.85) 0%,
            rgba(255, 255, 255, 0.75) 100%
            ),
            url('/main_background.avif')`,
        }}
      >
        <div className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-black text-5xl font-black leading-tight tracking-tight">
            새로운 공간을
          </h1>
          <h2 className="text-black text-4xl font-black leading-tight tracking-tight">
            만들어보세요.
          </h2>
          
          <div className="flex flex-col gap-1 mt-4">
            <p className="text-black font-semibold text-lg leading-relaxed">
              원하는 방의 평면도를 그리고
            </p>
            <p className="text-black font-semibold text-lg leading-relaxed">
              3D 공간으로 변환해보세요
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <Button 
            variant="primary"
            size="lg"
            onClick={onStart}
          >
            시작하기
          </Button>
          <Button 
            variant="default"
            size="lg"
            onClick={onClose}
          >
            나중에
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateStartModal;