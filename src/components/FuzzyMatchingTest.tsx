import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TestTube, 
  Target, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Info,
  Play,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useFuzzyMatching } from '../hooks/useFuzzyMatching';
import LoadingSpinner from './LoadingSpinner';

export const FuzzyMatchingTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'project' | 'similarity' | 'examples' | 'batch'>('project');
  
  // Local state for form inputs
  const [projectContent, setProjectContent] = useState('');
  const [string1, setString1] = useState('');
  const [string2, setString2] = useState('');
  const [batchTestCases, setBatchTestCases] = useState<string>('');

  // Use the fuzzy matching hook
  const {
    isLoading,
    error,
    projectResult,
    testProjectMatching,
    similarityResult,
    testSimilarity,
    examples,
    loadExamples,
    batchResults,
    runBatchTest,
    clearError,
  } = useFuzzyMatching();

  // Load examples on component mount
  useEffect(() => {
    loadExamples();
  }, [loadExamples]);

  const handleProjectMatching = async () => {
    await testProjectMatching(projectContent);
  };

  const handleSimilarityTest = async () => {
    await testSimilarity(string1, string2);
  };

  const handleBatchTest = async () => {
    if (!batchTestCases.trim()) {
      return;
    }

    const testCases = batchTestCases
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    await runBatchTest(testCases);
  };

  const TabButton: React.FC<{ 
    tab: typeof activeTab; 
    label: string; 
    icon: React.ReactNode;
    isActive: boolean;
  }> = ({ tab, label, icon, isActive }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${
          confidence >= 0.8 ? 'bg-green-500' :
          confidence >= 0.6 ? 'bg-yellow-500' :
          'bg-red-500'
        }`}
        style={{ width: `${confidence * 100}%` }}
      />
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <TestTube className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fuzzy Matching Test Suite</h2>
            <p className="text-sm text-gray-600">
              Test and debug the enhanced fuzzy matching system
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <TabButton
            tab="project"
            label="Project Matching"
            icon={<Target className="w-4 h-4" />}
            isActive={activeTab === 'project'}
          />
          <TabButton
            tab="similarity"
            label="Similarity Test"
            icon={<Zap className="w-4 h-4" />}
            isActive={activeTab === 'similarity'}
          />
          <TabButton
            tab="examples"
            label="Examples"
            icon={<BookOpen className="w-4 h-4" />}
            isActive={activeTab === 'examples'}
          />
          <TabButton
            tab="batch"
            label="Batch Test"
            icon={<Play className="w-4 h-4" />}
            isActive={activeTab === 'batch'}
          />
        </div>

        {/* Project Matching Tab */}
        {activeTab === 'project' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Content to Test
              </label>
              <textarea
                value={projectContent}
                onChange={(e) => setProjectContent(e.target.value)}
                placeholder="Enter email content with potential typos (e.g., 'We have an urgnt isue with the CK Alumi portal')"
                className="input-field h-32 resize-none"
              />
            </div>

            <button
              onClick={handleProjectMatching}
              disabled={isLoading || !projectContent.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Test Project Matching
            </button>

            {projectResult && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detected Project
                    </label>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-600">
                        {projectResult.detectedProject || 'None detected'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidence Score
                    </label>
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {(projectResult.confidence * 100).toFixed(1)}%
                        </span>
                        <ConfidenceBar confidence={projectResult.confidence} />
                      </div>
                    </div>
                  </div>
                </div>

                {projectResult.matchedKeywords && projectResult.matchedKeywords.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matched Keywords
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {projectResult.matchedKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {projectResult.suggestions && projectResult.suggestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternative Suggestions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {projectResult.suggestions.map((suggestion, index) => (
                        <span
                          key={index}
                          className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm"
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Similarity Test Tab */}
        {activeTab === 'similarity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First String
                </label>
                <input
                  type="text"
                  value={string1}
                  onChange={(e) => setString1(e.target.value)}
                  placeholder="e.g., 'urgent'"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second String
                </label>
                <input
                  type="text"
                  value={string2}
                  onChange={(e) => setString2(e.target.value)}
                  placeholder="e.g., 'urgnt'"
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleSimilarityTest}
              disabled={isLoading || !string1.trim() || !string2.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Similarity
            </button>

            {similarityResult && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Similarity Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Similarity Score
                    </label>
                    <span className="text-lg font-semibold text-blue-600">
                      {(similarityResult.similarity * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edit Distance
                    </label>
                    <span className="text-lg font-semibold text-orange-600">
                      {similarityResult.distance}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Threshold
                    </label>
                    <span className="text-lg font-semibold text-gray-600">
                      {(similarityResult.threshold * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Match Status
                    </label>
                    <div className="flex items-center gap-1">
                      {similarityResult.isMatch ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-semibold ${
                        similarityResult.isMatch ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {similarityResult.isMatch ? 'Match' : 'No Match'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Fuzzy Matching Examples
              </h3>
              <button
                onClick={loadExamples}
                disabled={isLoading}
                className="btn-secondary flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>

            {isLoading ? (
              <LoadingSpinner size="md" message="Loading examples..." />
            ) : examples.length > 0 ? (
              <div className="space-y-4">
                {examples.map((example, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <h4 className="font-semibold text-gray-900">{example.category}</h4>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Original: </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {example.original}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">Variations: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {example.variations.map((variation, vIndex) => (
                            <span
                              key={vIndex}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                            >
                              {variation}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No examples available
              </div>
            )}
          </div>
        )}

        {/* Batch Test Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Cases (one per line)
              </label>
              <textarea
                value={batchTestCases}
                onChange={(e) => setBatchTestCases(e.target.value)}
                placeholder={`Enter multiple test cases, one per line:
We have an urgnt isue with the CK Alumi portal
There's a problm with the Custmer Portal
The Employe Self Servce is down
Issue with the Payrol system`}
                className="input-field h-40 resize-none"
              />
            </div>

            <button
              onClick={handleBatchTest}
              disabled={isLoading || !batchTestCases.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Batch Test
            </button>

            {batchResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Batch Test Results ({batchResults.length} cases)
                </h3>
                
                <div className="space-y-3">
                  {batchResults.map((result, index) => (
                    <div key={index} className="bg-white rounded border p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Input: </span>
                          <span className="text-gray-600">{result.originalContent}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Project: </span>
                          <span className="text-green-600 font-medium">
                            {result.detectedProject || 'None'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Confidence: </span>
                          <span className={`font-medium ${
                            result.confidence >= 0.8 ? 'text-green-600' :
                            result.confidence >= 0.6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FuzzyMatchingTest;