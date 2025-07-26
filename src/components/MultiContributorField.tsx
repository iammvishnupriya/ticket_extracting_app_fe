import React, { useState } from 'react';
import { User, X, Plus } from 'lucide-react';
import { useContributors } from '../hooks/useContributors';
import type { Contributor } from '../types/ticket';

interface MultiContributorFieldProps {
  contributors: (string | Contributor)[];
  onChange: (contributors: (string | Contributor)[]) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  maxContributors?: number;
}

export const MultiContributorField: React.FC<MultiContributorFieldProps> = ({
  contributors = [],
  onChange,
  disabled = false,
  label = 'Contributors',
  required = false,
  maxContributors = 10,
}) => {
  const { getContributorOptions, findContributorByName, isLoading: contributorsLoading } = useContributors();
  const [selectedValue, setSelectedValue] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const contributorOptions = getContributorOptions();

  const getContributorName = (contributor: string | Contributor): string => {
    if (typeof contributor === 'string') return contributor;
    return contributor.name || '';
  };

  const getContributorId = (contributor: string | Contributor): number | undefined => {
    if (typeof contributor === 'object' && contributor.id) return contributor.id;
    return undefined;
  };

  const isContributorAlreadyAdded = (newContributor: string | Contributor): boolean => {
    const newName = getContributorName(newContributor);
    const newId = getContributorId(newContributor);
    
    return contributors.some(existing => {
      const existingName = getContributorName(existing);
      const existingId = getContributorId(existing);
      
      // Check by ID first (more reliable)
      if (newId && existingId && newId === existingId) return true;
      
      // Then check by name (case insensitive)
      return newName.toLowerCase() === existingName.toLowerCase();
    });
  };

  const addContributor = () => {
    if (contributors.length >= maxContributors) {
      return;
    }

    let contributorToAdd: string | Contributor | null = null;

    if (showCustomInput && customName.trim()) {
      // Adding custom contributor by name
      contributorToAdd = customName.trim();
    } else if (selectedValue && selectedValue !== 'custom') {
      // Adding contributor from dropdown
      const foundContributor = findContributorByName(selectedValue);
      contributorToAdd = foundContributor ? foundContributor : selectedValue;
    }

    if (contributorToAdd && !isContributorAlreadyAdded(contributorToAdd)) {
      onChange([...contributors, contributorToAdd]);
      
      // Reset form
      setSelectedValue('');
      setCustomName('');
      setShowCustomInput(false);
    }
  };

  const removeContributor = (index: number) => {
    const newContributors = contributors.filter((_, i) => i !== index);
    onChange(newContributors);
  };

  const handleDropdownChange = (value: string) => {
    setSelectedValue(value);
    if (value === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomName('');
    }
  };

  const canAddMore = contributors.length < maxContributors;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-600" />
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          ({contributors.length}/{maxContributors})
        </span>
      </div>

      {/* Existing Contributors */}
      {contributors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contributors.map((contributor, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <User className="w-3 h-3" />
              <span>{getContributorName(contributor)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeContributor(index)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  title="Remove contributor"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Contributor */}
      {canAddMore && !disabled && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {contributorsLoading ? (
              <div className="flex-1 input-field flex items-center justify-center py-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2"></div>
                Loading contributors...
              </div>
            ) : (
              <>
                <select
                  value={selectedValue}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className="flex-1 input-field"
                  disabled={disabled}
                >
                  <option value="">Select contributor</option>
                  {contributorOptions.map((option) => (
                    <option key={option.value} value={option.label}>
                      {option.label} {option.department && `(${option.department})`}
                    </option>
                  ))}
                  <option value="custom">Other (Custom)</option>
                </select>
                
                <button
                  type="button"
                  onClick={addContributor}
                  disabled={disabled || (!selectedValue || (showCustomInput && !customName.trim()))}
                  className="btn-secondary flex items-center gap-1 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add contributor"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </>
            )}
          </div>

          {showCustomInput && (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter contributor name"
              className="input-field w-full"
              disabled={disabled}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addContributor();
                }
              }}
            />
          )}
        </div>
      )}

      {/* Max contributors reached message */}
      {!canAddMore && (
        <p className="text-sm text-gray-500">
          Maximum number of contributors ({maxContributors}) reached.
        </p>
      )}

      {/* No contributors message */}
      {contributors.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No contributors assigned. Add contributors using the dropdown above.
        </p>
      )}
    </div>
  );
};