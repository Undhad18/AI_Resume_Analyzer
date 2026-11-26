import { TEMPLATE_IDS, DEFAULT_TEMPLATE } from "./templateConfig";
import ModernTemplate from "./ModernTemplate";
import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";
import ATSTemplate from "./ATSTemplate";

/**
 * Master Template Renderer (Lesson 8.4)
 * Dispatches resumeData to the active template layout.
 */
export const TemplateRenderer = ({ resumeData = {}, selectedTemplate = DEFAULT_TEMPLATE }) => {
  switch (selectedTemplate) {
    case TEMPLATE_IDS.CLASSIC:
      return <ClassicTemplate resumeData={resumeData} />;

    case TEMPLATE_IDS.MINIMAL:
      return <MinimalTemplate resumeData={resumeData} />;

    case TEMPLATE_IDS.ATS:
      return <ATSTemplate resumeData={resumeData} />;

    case TEMPLATE_IDS.MODERN:
    default:
      return <ModernTemplate resumeData={resumeData} />;
  }
};

export default TemplateRenderer;
