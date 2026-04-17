import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import axios from 'axios';
import { FileText, ArrowLeft, Download } from 'lucide-react';

const MaterialViewer = () => {
  const { idMaterial } = useParams();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // API Translator States
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');

  useEffect(() => {
    fetchMaterial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idMaterial]);

  const fetchMaterial = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('materiales')
        .select('*')
        .eq('id_material', idMaterial)
        .single();
        
      setMaterial(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleTranslate = async () => {
    if(!material?.contenido_texto) return;
    setIsTranslating(true);
    try {
      // Invocamos a la API de Traducción Educativa externa (MyMemory API Libre)
      const resp = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(material.contenido_texto)}&langpair=en|es`);
      if (resp.data?.responseData?.translatedText) {
         setTranslatedText(resp.data.responseData.translatedText);
      } else {
         setTranslatedText("No se pudo traducir o el servicio está saturado.");
      }
    } catch(err) {
      console.error(err);
      setTranslatedText("Error en el API de traducción educativa. Reintenta más tarde.");
    }
    setIsTranslating(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando detalles del material...</div>;
  if (!material) return <div style={{ padding: '2rem', textAlign: 'center' }}>Material no encontrado en el sistema.</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Botón Volver */}
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowLeft size={18} /> Volver al Curso
      </button>

      {/* Cabecera del Documento */}
      <div className="card" style={{ marginBottom: '2rem', borderTop: '5px solid var(--accent-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <FileText size={40} color="var(--accent-color)" />
          <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.8rem' }}>{material.titulo}</h1>
        </div>

        {/* Zona de Instrucciones Interactiva */}
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
             <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>Descripción del Apunte:</h3>
             
             {/* Botón de la API de Traducción */}
             {material.contenido_texto && (
                <button onClick={handleTranslate} disabled={isTranslating} className="btn" style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🌐 {isTranslating ? 'Traduciendo...' : 'API Traductor (EN a ES)'}
                </button>
             )}
          </div>
          
          <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {material.contenido_texto || <i>El docente no añadió descripción extra a este documento.</i>}
          </p>
          
          {/* Resultados Dinámicos del API de Traduccion */}
          {translatedText && (
            <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1rem', borderLeft: '4px solid var(--accent-color)', backgroundColor: 'var(--bg-secondary)', borderRadius: '0 0.5rem 0.5rem 0' }}>
               <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '0.5rem' }}>Traducción API (Español):</strong> 
               <p style={{ margin: 0, lineHeight: '1.5' }}>{translatedText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cajón de Extracción del Archivo */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Recurso Adjunto</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>El archivo original se encuentra asegurado en la plataforma y listo para su estudio.</p>
        
        {material.url_archivo_adjunto ? (
          <a href={material.url_archivo_adjunto} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', padding: '1rem 2rem', fontSize: '1.1rem', alignItems: 'center', gap: '0.5rem', borderRadius: '50px' }}>
            <Download size={22} /> Descargar Documento
          </a>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--text-secondary)' }}>
            El documento aún no cuenta con un archivo extraible en el Storage.
          </div>
        )}
      </div>

    </div>
  );
};

export default MaterialViewer;
