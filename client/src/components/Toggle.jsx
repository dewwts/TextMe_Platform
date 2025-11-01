import PropTypes from 'prop-types';

/**
 * Reusable Toggle Component (Switch)
 * @param {boolean} enabled - Toggle state
 * @param {function} onChange - Change handler
 * @param {string} label - Optional label text
 * @param {string} size - 'sm', 'md', 'lg'
 */
function Toggle({ enabled, onChange, label, size = 'md' }) {
  // Size configurations
  const sizes = {
    sm: {
      container: 'w-10 h-5',
      circle: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    md: {
      container: 'w-14 h-7',
      circle: 'w-6 h-6',
      translate: 'translate-x-7'
    },
    lg: {
      container: 'w-16 h-8',
      circle: 'w-7 h-7',
      translate: 'translate-x-8'
    }
  };

  const sizeConfig = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={onChange}
        className={`${sizeConfig.container} relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e45b8f] focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          enabled
            ? 'bg-[#e45b8f] dark:bg-[#e45b8f]'
            : 'bg-gray-300 dark:bg-gray-700'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`${sizeConfig.circle} inline-block transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
            enabled ? sizeConfig.translate : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

Toggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default Toggle;
