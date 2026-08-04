import { useState, useCallback } from 'react';
import { Icon, IconPaths } from './icons';

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  autoComplete,
  name,
  id,
  leftIcon,
  rightElement,
  maxLength,
  pattern,
  validate,
}) {
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  const handleChange = useCallback((e) => {
    if (onChange) onChange(e.target.value, e);
  }, [onChange]);
  
  const handleBlur = useCallback((e) => {
    setTouched(true);
    if (onBlur) onBlur(e.target.value, e);
  }, [onBlur]);
  
  const showError = touched && error;
  
  const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}
      
      <div className={`form-input-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {leftIcon && (
          <div className="form-input-icon-left">
            <Icon size={18}>{leftIcon}</Icon>
          </div>
        )}
        
        <input
          id={fieldId}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined}
          className="form-input"
        />
        
        {isPassword && (
          <button
            type="button"
            className="form-input-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon size={16}>{showPassword ? IconPaths.eyeOff : IconPaths.eye}</Icon>
          </button>
        )}
        
        {rightElement && !isPassword && (
          <div className="form-input-icon-right">
            {rightElement}
          </div>
        )}
      </div>
      
      {showError && (
        <div id={`${fieldId}-error`} className="form-error" role="alert">
          <Icon size={14}>{IconPaths.alertCircle}</Icon>
          {error}
        </div>
      )}
      
      {!showError && helper && (
        <div id={`${fieldId}-helper`} className="form-helper">
          {helper}
        </div>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  helper,
  required = false,
  disabled = false,
  name,
  id,
}) {
  const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}
      
      <div className={`form-select-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value, e)}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined}
          className="form-select"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="form-select-arrow">
          <Icon size={16}>{IconPaths.chevronDown}</Icon>
        </div>
      </div>
      
      {error && (
        <div id={`${fieldId}-error`} className="form-error" role="alert">
          <Icon size={14}>{IconPaths.alertCircle}</Icon>
          {error}
        </div>
      )}
      
      {!error && helper && (
        <div id={`${fieldId}-helper`} className="form-helper">
          {helper}
        </div>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  name,
  id,
}) {
  const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  const charCount = value?.length || 0;
  const showCharCount = maxLength && charCount > maxLength * 0.8;
  
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}
      
      <div className={`form-textarea-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value, e)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined}
          className="form-textarea"
        />
      </div>
      
      <div className="form-footer">
        {error ? (
          <div id={`${fieldId}-error`} className="form-error" role="alert">
            <Icon size={14}>{IconPaths.alertCircle}</Icon>
            {error}
          </div>
        ) : (
          <>
            {helper && <div id={`${fieldId}-helper`} className="form-helper">{helper}</div>}
            {showCharCount && (
              <span className={`form-char-count ${charCount > maxLength ? 'over-limit' : ''}`}>
                {charCount}/{maxLength}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  name,
  id,
  disabled = false,
}) {
  const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <label className={`checkbox-field ${disabled ? 'is-disabled' : ''}`} htmlFor={fieldId}>
      <input
        id={fieldId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked, e)}
        disabled={disabled}
        className="checkbox-input"
      />
      <span className="checkbox-custom"></span>
      <span className="checkbox-label">{label}</span>
    </label>
  );
}

export function RadioField({
  label,
  value,
  checked,
  onChange,
  name,
  id,
  disabled = false,
}) {
  const fieldId = id || name || `${label?.toLowerCase().replace(/\s+/g, '-')}-${value}`;
  
  return (
    <label className={`radio-field ${disabled ? 'is-disabled' : ''}`} htmlFor={fieldId}>
      <input
        id={fieldId}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={(e) => onChange?.(e.target.value, e)}
        disabled={disabled}
        className="radio-input"
      />
      <span className="radio-custom"></span>
      <span className="radio-label">{label}</span>
    </label>
  );
}
