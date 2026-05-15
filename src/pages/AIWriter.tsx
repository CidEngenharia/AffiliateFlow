import React, { useState } from 'react';
import { 
  Wand2, 
  Copy, 
  Check, 
  Sparkles, 
  Type, 
  Users, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { aiService } from '../services/aiService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AIWriter: React.FC = () => {
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!title) {
      setError('Por favor, informe o título ou nome do produto.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.generateCaption(title, audience || 'geral');
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao gerar a legenda.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse the response if it follows the "Opção X" format
  const parseOptions = (text: string) => {
    if (!text) return [];
    
    // Simple split by options, might need refinement based on Gemini's exact output
    const options = text.split(/Opção \d+/i).filter(opt => opt.trim().length > 0);
    return options;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Sparkles className="w-8 h-8 text-primary mr-3" />
          Gerador de Legendas IA
        </h1>
        <p className="text-muted-foreground text-lg">
          Crie copys persuasivas e magnéticas para seus produtos em segundos usando inteligência artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Type className="w-4 h-4 mr-2 text-primary" />
                  Produto/Título
                </label>
                <input
                  type="text"
                  placeholder="Ex: Curso de Marketing Digital"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  Público Alvo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jovens empreendedores"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-center p-3 text-sm text-danger bg-danger/10 rounded-lg border border-danger/20">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                variant="primary" 
                className="w-full py-6 text-lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Copys...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Gerar Legendas
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <h3 className="text-sm font-semibold text-primary flex items-center mb-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Dica Pro
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quanto mais específico você for no título e no público, melhor será a persuasão da legenda gerada.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="md:col-span-2 space-y-6">
          {!result && !isGenerating && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-12 text-center bg-card/30">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sua copy aparecerá aqui</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Preencha as informações ao lado e clique em "Gerar Legendas" para ver a mágica acontecer.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-card/30 rounded-2xl border border-border animate-pulse">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium">A IA está escrevendo suas legendas...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 gap-6">
                {parseOptions(result).map((option, idx) => (
                  <Card key={idx} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all">
                    <div className="bg-primary/5 px-4 py-2 border-b border-primary/10 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Opção {idx + 1}
                      </span>
                      <button
                        onClick={() => handleCopy(option.trim(), idx)}
                        className="p-1.5 hover:bg-primary/10 rounded-md transition-colors text-primary flex items-center text-xs font-medium"
                      >
                        {copiedIndex === idx ? (
                          <><Check className="w-3.5 h-3.5 mr-1" /> Copiado</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</>
                        )}
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                        {option.trim()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Full Text View if parsing fails or as a fallback */}
              {parseOptions(result).length === 0 && (
                <Card className="p-6 relative">
                   <button
                    onClick={() => handleCopy(result, 99)}
                    className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    {copiedIndex === 99 ? <Check className="text-success" /> : <Copy className="text-muted-foreground" />}
                  </button>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed pt-8">
                    {result}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIWriter;
