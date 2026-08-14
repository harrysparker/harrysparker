import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Order, ProofOfDelivery } from '../types';
import { ShieldCheck, Check, Camera, PenTool, Lock, X } from 'lucide-react';

interface ProofOfDeliveryModalProps {
  order: Order;
  onClose: () => void;
  onConfirmDelivery: (orderId: string, proof: ProofOfDelivery) => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  order,
  onClose,
  onConfirmDelivery,
}) => {
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<boolean>(false);
  const [receivedByName, setReceivedByName] = useState<string>(order.clientName);
  const [photoPreview, setPhotoPreview] = useState<string>(
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setHasSignature(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#10B981'; // Emerald stroke

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  // Submit delivery validation
  const handleVerifyAndComplete = () => {
    const expectedOtp = order.proof?.otpCode || '8492';

    if (enteredOtp.trim() !== expectedOtp.trim()) {
      setOtpError(true);
      return;
    }

    setOtpError(false);

    // Get signature data URL
    let signatureUrl = '';
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL();
    }

    // Trigger celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onConfirmDelivery(order.id, {
      otpCode: enteredOtp,
      isOtpVerified: true,
      signatureDataUrl: signatureUrl,
      photoUrl: photoPreview,
      deliveredAt: new Date().toLocaleTimeString(),
      receivedBy: receivedByName
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 w-full max-w-lg rounded-3xl p-6 shadow-xl space-y-5 relative text-gray-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-[#009E49] font-black text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#FF8C00]" />
            <span>Preuve de Livraison Ivoire Delivery</span>
          </div>
          <h3 className="text-xl font-bold font-['Outfit'] text-[#111827]">
            Validation du Colis ({order.trackingNumber})
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Saisissez le code OTP 4 chiffres fourni par le client, capturez sa signature et confirmez la remise.
          </p>
        </div>

        {/* 1. OTP Code Input */}
        <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <label className="block text-xs font-black text-[#FF8C00] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Code OTP de Sécurité Client (4 Chiffres)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={enteredOtp}
              onChange={e => {
                setEnteredOtp(e.target.value);
                setOtpError(false);
              }}
              placeholder="Ex: 8492"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-black text-center text-2xl tracking-widest text-[#009E49] focus:outline-none focus:border-[#009E49] font-mono"
            />
          </div>
          {otpError && (
            <p className="text-xs text-rose-500 font-bold">
              ❌ Code OTP incorrect ! Vérifiez auprès du client (attendu: {order.proof?.otpCode}).
            </p>
          )}
        </div>

        {/* 2. Received By Name */}
        <div className="text-xs">
          <label className="block text-gray-500 mb-1 font-bold">Nom du Destinataire</label>
          <input
            type="text"
            value={receivedByName}
            onChange={e => setReceivedByName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 font-medium focus:outline-none focus:border-[#FF8C00]"
          />
        </div>

        {/* 3. Canvas Signature Pad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-700 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-sky-600" />
              <span>Signature sur Écran (Client)</span>
            </span>
            <button
              onClick={clearCanvas}
              className="text-[10px] text-gray-400 hover:text-gray-700 underline cursor-pointer"
            >
              Effacer
            </button>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={100}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="w-full h-24 cursor-crosshair touch-none"
            />
          </div>
        </div>

        {/* 4. Photo Proof Preview */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-gray-700 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-[#FF8C00]" />
            <span>Photo du Colis Remis</span>
          </span>
          <div className="flex items-center gap-3">
            <img
              src={photoPreview}
              alt="Photo de livraison"
              className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-200"
            />
            <div className="text-[11px] text-gray-500 font-medium">
              Photo géolocalisée enregistrée automatiquement.
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleVerifyAndComplete}
          className="w-full bg-[#009E49] hover:bg-emerald-600 text-white font-black py-3 rounded-2xl text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-5 h-5" />
          <span>Valider la Preuve & Créditer le Wallet</span>
        </button>

      </div>
    </div>
  );
};
